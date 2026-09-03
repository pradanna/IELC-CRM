import { useState, useEffect } from 'react';
import axios from 'axios';

export function useWhatsappInbox(branches = [], defaultChannel = 'official') {
    const [activeTab, setActiveTab] = useState(defaultChannel); // 'official' | 'baileys'
    const [selectedBranch, setSelectedBranch] = useState(branches[0]?.code || 'solo');
    
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for Meta Templates
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Fetch conversation contacts list based on active tab & branch
    const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
            let res;
            if (activeTab === 'official') {
                res = await axios.get(route('admin.whatsapp.official.conversations'));
            } else {
                res = await axios.get(route('admin.whatsapp.baileys.conversations', selectedBranch));
            }
            if (res.data.status === 'success') {
                setContacts(res.data.data);
                if (res.data.data.length > 0 && !selectedContact) {
                    setSelectedContact(res.data.data[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch contacts:', err);
        } finally {
            setLoadingContacts(false);
        }
    };

    // Fetch message history for selected contact
    const fetchMessages = async (contact) => {
        if (!contact) return;
        setLoadingMessages(true);
        try {
            const res = await axios.get(route('admin.whatsapp.chat-history'), {
                params: {
                    phone: contact.phone,
                    channel: activeTab,
                    branch: selectedBranch,
                }
            });
            if (res.data.status === 'success') {
                setMessages(res.data.messages);
            }
        } catch (err) {
            console.error('Failed to fetch chat history:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Fetch official templates
    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const res = await axios.get(route('admin.whatsapp.official.templates'));
            if (res.data.status === 'success') {
                setTemplates(res.data.templates);
            }
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    // Handle sending standard message
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!inputMessage.trim() || !selectedContact || sending) return;

        setSending(true);
        const textToSend = inputMessage;
        setInputMessage('');

        try {
            let res;
            if (activeTab === 'official') {
                res = await axios.post(route('admin.whatsapp.official.send'), {
                    phone: selectedContact.phone,
                    message: textToSend,
                });
            } else {
                res = await axios.post(route('admin.whatsapp.send'), {
                    branch: selectedBranch,
                    phone: selectedContact.phone,
                    message: textToSend,
                });
            }

            // Optimistic update to UI
            const newMsg = {
                id: 'msg_' + Date.now(),
                sender: 'admin',
                text: textToSend,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
            };
            setMessages((prev) => [...prev, newMsg]);
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Gagal mengirim pesan.');
        } finally {
            setSending(false);
        }
    };

    // Send WhatsApp Meta Approved Template
    const handleSendTemplate = async (template, variables = {}) => {
        if (!selectedContact || sending) return;
        setSending(true);

        try {
            let filledBody = template.body;
            Object.keys(variables).forEach((key, idx) => {
                filledBody = filledBody.replace(`{{${idx + 1}}}`, variables[key]);
            });

            await axios.post(route('admin.whatsapp.official.send'), {
                phone: selectedContact.phone,
                template_name: template.name,
                variables: variables,
                message: filledBody,
            });

            const newMsg = {
                id: 'msg_tpl_' + Date.now(),
                sender: 'admin',
                text: filledBody,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
                template_name: template.name,
            };
            setMessages((prev) => [...prev, newMsg]);
            setIsTemplateModalOpen(false);
        } catch (err) {
            console.error('Failed to send template:', err);
            alert('Gagal mengirim template.');
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        setSelectedContact(null);
        setMessages([]);
        fetchContacts();
    }, [activeTab, selectedBranch]);

    useEffect(() => {
        if (selectedContact) {
            fetchMessages(selectedContact);
        }
    }, [selectedContact]);

    const filteredContacts = contacts.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    return {
        activeTab,
        setActiveTab,
        selectedBranch,
        setSelectedBranch,
        contacts: filteredContacts,
        selectedContact,
        setSelectedContact,
        messages,
        inputMessage,
        setInputMessage,
        loadingContacts,
        loadingMessages,
        sending,
        searchQuery,
        setSearchQuery,
        handleSendMessage,
        handleSendTemplate,
        isTemplateModalOpen,
        setIsTemplateModalOpen,
        templates,
        loadingTemplates,
        fetchTemplates,
    };
}
